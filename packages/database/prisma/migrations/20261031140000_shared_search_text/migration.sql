-- One comparison rule for every search of the site (audit RL, 31 October
-- 2026). public.search_text mirrors normalizeSearchText
-- (apps/web/src/shared/utils/search-text.utils.ts): NFKD decomposition,
-- diacritics removed, lower case, letters such as « œ », « ø » or « ß » spelled
-- in Latin, punctuation and symbols read as spaces. Its letter table is
-- generated from the TypeScript rule (Latin, Greek, Cyrillic, compatibility
-- forms), so case is folded without depending on the database language; plain
-- ASCII values skip it. The activity journal PostgreSQL suite compares both
-- rules character by character: changing one needs a migration for the other.
CREATE FUNCTION "public"."search_text"(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT PARALLEL SAFE
AS $function$
SELECT pg_catalog.btrim(pg_catalog.regexp_replace(
    CASE
        WHEN value ~ '[^\u0001-\u007f]' THEN pg_catalog.translate(
            pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.normalize(value, 'NFKD'), '[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe00-\ufe0f\ufe20-\ufe2f]', '', 'g')), 'Æ', 'ae'), 'Þ', 'th'), 'ß', 'ss'), 'æ', 'ae'), 'þ', 'th'), 'Œ', 'oe'), 'œ', 'oe'), 'ẞ', 'ss'),
            'ÐØðøĐđĦħıŁłŊŦŧƁƂƄƆƇƉƊƋƎƏƐƑƓƔƖƗƘƜƝƟƢƤƦƧƩƬƮƱƲƳƵƷƸƼǤǶǷȜȠȢȤȺȻȽȾɁɃɄɅɆɈɊɌɎͰͲͶͿΑΕΗΙΟΥΩΒΓΔΖΘΚΛΜΝΞΠΡΣΤΦΧΨςϏϘϚϜϞϠϢϤϦϨϪϬϮϷϺϽϾϿЕЂГЄЅІЈЉЊЋКИУЏАБВДЖЗЛМНОПРСТФХЦЧШЩЪЫЬЭЮЯѠѢѤѦѨѪѬѮѰѲѴѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾӀӃӅӇӉӋӍӔӘӠӨӶӺӼӾԀԂԄԆԈԊԌԎԐԒԔԖԘԚԜԞԠԢԤԦԨԪԬԮỺỼỾ',
            'dododdhhillŋttɓƃƅɔƈɖɗƌǝəɛƒɠɣɩɨƙɯɲɵƣƥʀƨʃƭʈʊʋƴƶʒƹƽǥƕƿȝƞȣȥⱥȼƚⱦɂƀʉʌɇɉɋɍɏͱͳͷϳαεηιουωβγδζθκλμνξπρστφχψσϗϙϛϝϟϡϣϥϧϩϫϭϯϸϻͻͼͽеђгєѕіјљњћкиуџабвджзлмнопрстфхцчшщъыьэюяѡѣѥѧѩѫѭѯѱѳѵѹѻѽѿҁҋҍҏґғҕҗҙқҝҟҡңҥҧҩҫҭүұҳҵҷҹһҽҿӏӄӆӈӊӌӎӕәӡөӷӻӽӿԁԃԅԇԉԋԍԏԑԓԕԗԙԛԝԟԡԣԥԧԩԫԭԯỻỽỿ'
        )
        ELSE pg_catalog.lower(value)
    END,
    '[\u0009-\u000d\u0020-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u00bf\u00d7\u00f7\u02b9-\u02bf\u1680\u2000-\u2bff\u3000-\u3004\u3008-\u3020\ufeff\U0001f000-\U0001faff]+',
    ' ',
    'g'
), ' ')
$function$;

-- Users: identity words and contact address are compared on this form. The
-- former column indexes could not serve the former lower/translate comparison;
-- these expression indexes (absent from schema.prisma) serve the new one.
DROP INDEX IF EXISTS "public"."User_loginName_trgm_idx";
DROP INDEX IF EXISTS "public"."User_firstName_trgm_idx";
DROP INDEX IF EXISTS "public"."User_lastName_trgm_idx";
DROP INDEX IF EXISTS "public"."User_contactEmail_trgm_idx";

CREATE INDEX "User_search_identity_trgm_idx"
ON "public"."User" USING GIN (
    "public"."search_text"(
        COALESCE("loginName", '') || ' ' || COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')
    ) gin_trgm_ops
);

CREATE INDEX "User_search_contact_trgm_idx"
ON "public"."User" USING GIN ("public"."search_text"("contactEmail") gin_trgm_ops);

-- Activity journal: the four names captured with each event, in the same
-- form, written once by the database when the event is inserted.
ALTER TABLE "public"."AuditLog" ADD COLUMN "searchText" TEXT;

CREATE FUNCTION "public"."set_audit_log_search_text"()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW."searchText" := NULLIF("public"."search_text"(
        COALESCE(NEW."actorDisplayNameSnapshot", '') || ' ' ||
        COALESCE(NEW."actorLoginNameSnapshot", '') || ' ' ||
        COALESCE(NEW."targetDisplayNameSnapshot", '') || ' ' ||
        COALESCE(NEW."targetLoginNameSnapshot", '')
    ), '');

    RETURN NEW;
END;
$$;

CREATE TRIGGER "AuditLog_search_text"
BEFORE INSERT ON "public"."AuditLog"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_audit_log_search_text"();

-- Events are append-only (AuditLog_guard_mutation). The guard is lifted inside
-- this migration only, to fill the new column of past events; no other column
-- changes (the identity snapshots stay protected by their own trigger).
ALTER TABLE "public"."AuditLog" DISABLE TRIGGER "AuditLog_guard_mutation";

UPDATE "public"."AuditLog"
SET "searchText" = NULLIF("public"."search_text"(
    COALESCE("actorDisplayNameSnapshot", '') || ' ' ||
    COALESCE("actorLoginNameSnapshot", '') || ' ' ||
    COALESCE("targetDisplayNameSnapshot", '') || ' ' ||
    COALESCE("targetLoginNameSnapshot", '')
), '');

ALTER TABLE "public"."AuditLog" ENABLE TRIGGER "AuditLog_guard_mutation";

DROP INDEX IF EXISTS "public"."AuditLog_actorDisplayNameSnapshot_trgm_idx";
DROP INDEX IF EXISTS "public"."AuditLog_actorLoginNameSnapshot_trgm_idx";
DROP INDEX IF EXISTS "public"."AuditLog_targetDisplayNameSnapshot_trgm_idx";
DROP INDEX IF EXISTS "public"."AuditLog_targetLoginNameSnapshot_trgm_idx";

CREATE INDEX "AuditLog_searchText_trgm_idx"
ON "public"."AuditLog" USING GIN ("searchText" gin_trgm_ops);

-- Directory: the stored search forms follow the same rule. A name made only
-- of symbols (« -_- ») keeps its former form, so it stays non-empty and
-- searchable as typed.
UPDATE "public"."Person"
SET
    "normalizedNickname" = COALESCE(NULLIF("public"."search_text"("nickname"), ''), "normalizedNickname"),
    "normalizedFirstName" = COALESCE(NULLIF("public"."search_text"("firstName"), ''), "normalizedFirstName"),
    "normalizedLastName" = COALESCE(NULLIF("public"."search_text"("lastName"), ''), "normalizedLastName");

UPDATE "public"."Person"
SET "sortName" = COALESCE(
    "normalizedNickname",
    "normalizedFirstName" || ' ' || "normalizedLastName"
);

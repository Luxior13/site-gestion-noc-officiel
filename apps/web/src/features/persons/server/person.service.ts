import 'server-only';

export {
  addPersonEmail,
  addPersonPhone,
  deletePersonEmail,
  deletePersonPhone,
  updatePersonEmail,
  updatePersonPhone,
} from './person-contact.service';
export { createPerson, getPerson, updatePerson } from './person-core.service';
export { listPersons } from './person-list.service';
export {
  addPersonEmergencyContact,
  addPersonLegalGuardian,
  deletePersonEmergencyContact,
  deletePersonLegalGuardian,
  updatePersonEmergencyContact,
  updatePersonLegalGuardian,
} from './person-relatives.service';
export {
  addPersonSocialProfile,
  deletePersonSocialProfile,
  updatePersonSocialProfile,
} from './person-social.service';

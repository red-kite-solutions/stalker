export interface Role {
  name: string;
  description: string;
  shortDescription: string;
}

export const roles: Role[] = [
  {
    name: 'admin',
    description: 'Has full control over the application.',
    shortDescription: 'Full control',
  },
  {
    name: 'user',
    description: 'Can only use the application, but cannot edit its configuration.',
    shortDescription: 'Can use, but not configure',
  },
  {
    name: 'read-only',
    description: 'Has the read permissions of the user, but cannot edit anything but their own profile.',
    shortDescription: 'Can read as a user, but not edit',
  },
];

export const rolesInfoDialogText = {
  text: 'The user role is a crucial part of any user. Their role will define what they can and cannot do in Stalker.',
  title: 'User roles',
  positiveButtonText: 'Got it',
};

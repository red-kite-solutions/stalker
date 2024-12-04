export interface Role {
  name: string;
  displayName: string;
  description: string;
  shortDescription: string;
}

export const roles: Role[] = [
  {
    name: 'admin',
    displayName: $localize`:Admin|The administrator role display name:Admin`,
    description: $localize`:Full control long|Long description of the level of access of an administrator:Has full control over the application.`,
    shortDescription: $localize`:Full control|Short description of the level of access of an administrator:Full control`,
  },
  {
    name: 'user',
    displayName: $localize`:User|The user role display name:User`,
    description: $localize`:User permissions long description|Long description of the level of access of a user:Can only use the application, but cannot edit its configuration.`,
    shortDescription: $localize`:User permissions description|Short description of the level of access of a user:Can use, but not configure`,
  },
  {
    name: 'read-only',
    displayName: $localize`:Read-only|The read-only role display name:Read-only`,
    description: $localize`:Read-only permission long description|Long description of the level of access of a read-only user:Has the read permissions of the user, but cannot edit anything but their own profile.`,
    shortDescription: $localize`:Read-only permission description|Short description of the level of access of a read-only user:Can read as a user, but not edit`,
  },
];

export const rolesInfoDialogText = {
  text: $localize`:Application role description|Short description of what a user's role represents in the application:The user role is a crucial part of any user. Their role will define what they can and cannot do in Red Kite.`,
  title: $localize`:User roles|Title of the panel giving more info about roles:User roles`,
  primaryButtonText: $localize`:Got it|Accepting and aknowledging information:Got it`,
};

export interface IObjectKeys {
  [key: string]: string | any;
}

export interface RolesName extends IObjectKeys {
  admin: string;
  user: string;
  'read-only': string;
}

export const rolesName: RolesName = {
  admin: $localize`:Admin|The administrator role display name:Admin`,
  user: $localize`:User|The user role display name:User`,
  'read-only': $localize`:Read-only|The read-only role display name:Read-only`,
};

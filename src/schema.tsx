import { KeyMap, Schema, SchemaSettings } from '@orbit/data';

export const keyMap = new KeyMap();

const schemaDefinition: SchemaSettings =  {
  models: {
    activitystate: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        sequencenum: { type: 'number' },
      },
      relationships: {
      },
    },
    project: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        uilanguagebcp47: { type: 'string' },
        language: { type: 'string' },
        languageName: { type: 'string' },
        defaultFont: { type: 'string' },
        defaultFontSize: { type: 'string' },
        rtl: { type: 'boolean' },
        allowClaim: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
        dateArchived: { type: 'date' },
      },
      relationships: {
        projecttype: { type: 'hasOne', model: 'projecttype', inverse: 'projects' },
        session: { type: 'hasMany', model: 'session', inverse: 'projects' },
        mediafiles: { type: 'hasMany', model: 'mediafile', inverse: 'sessions'}
      }
    },
    user: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        givenName: { type: 'string' },
        familyName: { type: 'string' },
        avatarUrl: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        timezone: { type: 'string' },
        locale: { type: 'string' },
        isLocked: { type: 'boolean' },
        externalId: { type: 'string' },
        identityToken: { type: 'string' },
        uiLanguageBcp47: { type: 'string' },
        timerCountUp: { type: 'boolean' },
        playBackSpeed: { type: 'number' },
        progressBarTypeId: { type: 'number' },
        hotKeys: { type: 'string' },
        profileVisibilit: { type: 'number'},
        emailNotification: { type: 'boolean' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project', inverse: 'owner' },
        organizationMemberships: { type: 'hasMany', model: 'organizationMembership', inverse: 'user' },
        userRoles: { type: 'hasMany', model: 'userrole', inverse: 'user' },
        groupMemberships: { type: 'hasMany', model: 'groupmembership', inverse: 'user' },
      },
    },
    mediafile: {
      keys: { remoteId: {} },
      attributes: {
        passageId: { type: 'number' },
        planId: { type: 'number' },
        versionNumber: { type: 'number' },
        artifactType: { type: 'string' },
        eafUrl: { type: 'string' },
        audioUrl: { type: 'string' },
        duration: { type: 'number' },
        contentType: { type: 'string' },
        audioQuality: { type: 'string' },
        textQuality: { type: 'string' },
        transcription: { type: 'string' },
        originalFile: { type: 'string' },
        filesize: { type: 'number' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        session: { type: 'hasOne', model: 'session', inverse: 'mediafiles' },
      },
    },
  }
};

export const schema = new Schema(schemaDefinition);
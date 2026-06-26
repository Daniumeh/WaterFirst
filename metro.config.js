const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/private/defaults/exclusionList').default;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.blockList = exclusionList([
  /[/\\]\.agents[/\\].*/,
  /[/\\]supabase[/\\]\.temp[/\\].*/,
]);

module.exports = config;

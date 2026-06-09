import eslintPluginSecurityRules from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  eslintPluginSecurityRules.configs['flat/recommended']
];

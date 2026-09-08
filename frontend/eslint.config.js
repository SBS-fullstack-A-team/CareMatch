import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * NOTE: typescript-eslint 8.x 는 아직 TypeScript 7 을 peer 로 지원하지 않아 설치하지 않았다.
 * 현재 .ts/.tsx 의 타입·문법 검증은 `npm run typecheck` (tsc) 가 담당한다.
 * typescript-eslint 가 TS 7 을 지원하면 아래 files 에 '**\/*.{ts,tsx}' 를 추가한다.
 */
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])

import alias from '@rollup/plugin-alias';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import { resolvePkgPath, getBaseRollupPlugins } from './utils';

const pkgPath = resolvePkgPath('react-noop-renderer');
const outputFolder = resolvePkgPath('react-noop-renderer', true);

export default {
	input: `${pkgPath}/index.ts`,
	output: { file: `${outputFolder}/index.js`, name: 'ReactNoop', format: 'umd' },
	external: ['react', 'scheduler'],
	plugins: [
		alias({ entries: { hostConfig: `${pkgPath}/src/hostConfig.ts` } }),
		...getBaseRollupPlugins(),
		generatePackageJson({ inputFolder: pkgPath, outputFolder,
			baseContents: { name: 'react-noop-renderer', version: '1.0.0', main: 'index.js' }
		})
	]
};

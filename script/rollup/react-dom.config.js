import alias from '@rollup/plugin-alias';
import {
	getPackageJSON,
	resolvePkgPath,
	getBaseRollupPlugins
} from './utils.js';
const { name, module, peerDependencies } = getPackageJSON('react-dom');
import generatePackageJson from 'rollup-plugin-generate-package-json';
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
	//react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactDOM',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies), 'scheduler'],
		plugins: [
			...getBaseRollupPlugins(),
			//webpack resolve alias
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	},
	//react-test-utils
	{
		input: `${pkgPath}/client.ts`,
		output: { file: `${pkgDistPath}/client.js`, name: 'ReactDOMClient', format: 'umd' },
		external: ['react-dom'],
		plugins: getBaseRollupPlugins()
	},
	{
		input: `${pkgPath}/test-utils.ts`,
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'test-utils.js',
				format: 'umd'
			}
		],
		external: ['react-dom', 'react'],
		plugins: getBaseRollupPlugins()
	}
];

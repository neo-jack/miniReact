const { defaults } = require('jest-config');

module.exports = {
	...defaults,
	rootDir: process.cwd(),
	// 寻找测试用例忽略的文件夹
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	// 显式测试构建产物，避免 pnpm workspace 将裸导入解析到 TypeScript 源码。
	moduleNameMapper: {
		'^react$': '<rootDir>/dist/node_modules/react/index.js',
		'^react/jsx-runtime$': '<rootDir>/dist/node_modules/react/jsx-runtime.js',
		'^react/jsx-dev-runtime$':
			'<rootDir>/dist/node_modules/react/jsx-dev-runtime.js',
		'^react-dom$': '<rootDir>/dist/node_modules/react-dom/index.js',
		'^react-dom/client$': '<rootDir>/dist/node_modules/react-dom/client.js',
		'^react-dom/test-utils$':
			'<rootDir>/dist/node_modules/react-dom/test-utils.js'
	},
	// 依赖包的解析地址
	moduleDirectories: [
		// React 和 ReactDOM 包的地址
		'dist/node_modules',
		// 第三方依赖的地址
		...defaults.moduleDirectories
	],
	testEnvironment: 'jsdom'
};

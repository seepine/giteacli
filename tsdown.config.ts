import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outExtensions: (ctx) => {
    return {
      js: ctx.format === 'es' ? '.js' : undefined,
    }
  },
  platform: 'node',
  exports: true,
  dts: true,
  // 是否压缩输出文件
  minify: false,
  // 是否关闭生成单一文件
  unbundle: true,
  // 是否生成 source map 文件
  sourcemap: false,
  // 是否移除未使用的代码
  treeshake: false,
})

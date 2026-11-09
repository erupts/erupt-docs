// 从 erupt 主仓库同步 OpenAPI 文档到 public/openapi/erupt.json
// 源路径：$ERUPT_HOME/openapi/erupt.json，默认 ../erupt；源不存在时保留已提交的副本（CI 场景）
import {copyFileSync, existsSync, mkdirSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(process.env.ERUPT_HOME ?? resolve(root, '../erupt'), 'openapi/erupt.json')
const target = resolve(root, 'public/openapi/erupt.json')

if (!existsSync(source)) {
    console.warn(`[openapi] source not found: ${source}, keep ${existsSync(target) ? 'existing copy' : 'nothing'}`)
} else {
    const spec = JSON.parse(readFileSync(source, 'utf8'))
    if (!spec.openapi || !spec.paths) throw new Error(`[openapi] not an OpenAPI document: ${source}`)
    mkdirSync(dirname(target), {recursive: true})
    copyFileSync(source, target)
    console.log(`[openapi] ${spec.info?.title} ${spec.info?.version} · ${Object.keys(spec.paths).length} paths → public/openapi/erupt.json`)
}

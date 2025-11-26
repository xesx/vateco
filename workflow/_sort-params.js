import { Project, SyntaxKind } from 'ts-morph'

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
})

const sourceFile = project.getSourceFileOrThrow('wf-param.ts') // ← поправь путь
const variable = sourceFile.getVariableDeclarationOrThrow('params')
const initializer = variable.getInitializerOrThrow()

if (initializer.getKind() !== SyntaxKind.ObjectLiteralExpression) {
  throw new Error('params is not an object')
}

const obj = initializer.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
const props = obj.getProperties()

// ✅ ВАЖНО: сохраняем текст ДО удаления
const entries = props.map((p) => ({
  name: p.getName(),
  text: p.getText(),
}))

// ✅ сортировка
entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))

// ✅ удаляем старые
props.forEach((p) => p.remove())

// ✅ вставляем уже текстом
obj.addProperties(entries.map((e) => e.text))

sourceFile.saveSync()

console.log('✅ params отсортирован без ошибок')

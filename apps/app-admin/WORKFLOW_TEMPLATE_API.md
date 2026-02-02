# Workflow Template API
Все endpoint'ы начинаются с `/wf/template` и принимают только POST запросы.
## Endpoints
### POST /wf/template/create
Создание нового workflow template.
**Body:**
```json
{
  "name": "template-name",
  "description": "Template description",
  "schema": {}
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```
---
### POST /wf/template/get
Получение workflow template по ID.
**Body:**
```json
{
  "id": 1
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "template-name",
    "description": "Template description",
    "schema": {},
    "createdAt": "2026-02-02T10:00:00.000Z",
    "updatedAt": "2026-02-02T10:00:00.000Z"
  }
}
```
---
### POST /wf/template/list
Получение списка всех workflow templates (сортировка по дате создания, от новых к старым).
**Body:** пустой или `{}`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "template-name",
      "description": "Template description",
      "schema": {},
      "createdAt": "2026-02-02T10:00:00.000Z",
      "updatedAt": "2026-02-02T10:00:00.000Z"
    }
  ]
}
```
---
### POST /wf/template/update
Обновление имени и/или описания workflow template.
**Body:**
```json
{
  "id": 1,
  "name": "new-template-name",
  "description": "New description"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```
---
### POST /wf/template/update-schema
Обновление схемы workflow template.
**Body:**
```json
{
  "id": 1,
  "schema": {}
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```
---
### POST /wf/template/delete
Удаление workflow template по ID.
**Body:**
```json
{
  "id": 1
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```
---
## Обработка ошибок
Все endpoint'ы возвращают ошибки в следующем формате:
```json
{
  "success": false,
  "error": "Сообщение об ошибке"
}
```
HTTP статус код: `400 Bad Request`

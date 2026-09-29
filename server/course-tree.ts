/**
 * The API deliberately owns its data type instead of importing a browser
 * module. In a production service this type would normally be generated from
 * the database model or a shared API contract.
 */
export type CourseItem = {
  id: number
  name: string
  parent_id: number
}

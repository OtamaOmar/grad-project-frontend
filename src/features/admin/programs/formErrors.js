/** Message for a server-side field error (error.details.fields[field]), else null. */
export function serverFieldError(error, field) {
  return error?.details?.fields?.[field] ? error.message : null;
}

/** True when the server error points at one of the form's own fields. */
export function hasFieldError(error, fields) {
  return Object.keys(error?.details?.fields ?? {}).some((field) => fields.includes(field));
}

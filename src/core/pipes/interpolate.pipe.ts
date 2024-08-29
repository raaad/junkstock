import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Interpolating a string as a template literal
 * @usageNotes
 * ```html
 * {{ 'Hello, ${user.name}' | interpolate: data }} <!-- >> Hello, Bob -->
 * {{ 'Hello, ${this}' | interpolate: 'Bob' }} <!-- >> Hello, Bob -->
 * ```
 * ...
 * ```typescript
 * data = { user: { name: 'Bob' } }
 * ```
 */
export function interpolate(template: string, context: unknown) {
  const names = isObject((context ??= '')) ? Object.keys(context) : [];
  const values = isObject(context) ? Object.values(context) : [];

  return new Function(...names, `return \`${template}\`;`).call(context, ...values);

  function isObject(i: unknown): i is object {
    return typeof i === 'object';
  }
}

/** Interpolating a string as a template literal
 * @usageNotes
 * ```html
 * {{ 'Hello, ${user.name}' | interpolate: data }} <!-- >> Hello, Bob -->
 * {{ 'Hello, ${this}' | interpolate: 'Bob' }} <!-- >> Hello, Bob -->
 * ```
 * ...
 * ```typescript
 * data = { user: { name: 'Bob' } }
 * ```
 */
@Pipe({
  name: 'interpolate',
  standalone: true,
  pure: true
})
export class InterpolatePipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(template: string, context: unknown, securityContext: keyof typeof SecurityContext = 'STYLE') {
    return this.sanitizer.sanitize(SecurityContext[securityContext], interpolate(template, context));
  }
}

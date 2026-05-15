import baseSlugify from 'slugify';

baseSlugify.extend({
  қ: 'q',
  Қ: 'Q',
  ң: 'ng',
  Ң: 'Ng',
  ү: 'u',
  Ү: 'U',
  ұ: 'u',
  Ұ: 'U',
  ө: 'o',
  Ө: 'O',
  һ: 'h',
  Һ: 'H',
  ә: 'a',
  Ә: 'A',
  і: 'i',
  І: 'I',
});

export function slugify(input: string): string {
  return baseSlugify(input, { lower: true, strict: true, locale: 'ru' });
}

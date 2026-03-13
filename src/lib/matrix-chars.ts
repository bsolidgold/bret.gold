// Half-width katakana + symbols from The Matrix digital rain
// These are the actual character sets used in the movie's visual effects
export const MATRIX_CHARS =
  "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ" +
  "012345789" +
  "Z:.\"=*+-<>¦|╌ç" +
  "ɀɁɂŧƆƇƈƉƊƋ" +
  "日ﾖﾆﾇﾝ";

export function randomMatrixChar(): string {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

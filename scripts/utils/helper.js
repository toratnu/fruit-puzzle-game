// 汎用的なヘルパー関数をまとめるファイル

/**
 * 画像ファイルを非同期で読み込む
 * @param {string} url - 画像ファイルのURL
 * @returns {Promise<HTMLImageElement>} - 読み込まれたImageオブジェクト
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
}

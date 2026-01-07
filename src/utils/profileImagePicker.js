export const randomImage = () => {
    const images = [
      'boy.png',
      'cat.png',
      'gamer.png',
      'man-1.png',
      'man-2.png',
      'man-3.png',
      'man-4.png',
      'man.png',
      'woman-1.png',
      'woman.png',
    ];
    const randomNumber = Math.floor(Math.random() * images.length);
    return images[randomNumber];
}
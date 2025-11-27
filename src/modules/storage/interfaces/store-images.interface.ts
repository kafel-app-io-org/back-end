export interface StoreImages {
  uploadImage: (file: Express.Multer.File) => Promise<string>;

  downloadImage: (imagePath: string) => Promise<Buffer>;
}

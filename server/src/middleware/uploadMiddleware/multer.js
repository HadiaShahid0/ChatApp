import multer from "multer";
import path from "path";

export const createMulter = (folderName) => {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `src/uploads/${folderName}`);
    },

    filename(req, file, cb) {
      cb(
        null,
        Date.now() +
          "-" +
          Math.round(Math.random() * 1e9) +
          path.extname(file.originalname),
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  };

  return multer({
    storage,
    fileFilter,
  });
};

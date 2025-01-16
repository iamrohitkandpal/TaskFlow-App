// import { Cloudinary } from "@cloudinary/browser";

import { formatDate } from ".";

// const cloudinary = new Cloudinary({
//   cloud: {
//     cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
//   },
// });

// export const cloudinaryURL = async (file) => {
//   try {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

//     const response = await fetch(
//       `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
//       {
//         method: "POST",
//         body: formData,
//       }
//     );

//     if (!response.ok) throw new Error("Cloudinary upload failed!");

//     const result = await response.json();

//     return cloudinary.url(result.public_id, {
//       transformation: [{ quality: "auto", fetch_format: "auto" }],
//     });
//   } catch (error) {
//     console.error("Error uploading to Cloudinary:", error.message);
//     throw error;
//   }
// };




// src/utils/cloudinary.js

export const cloudinaryURL = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    console.log(file);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Cloudinary upload failed!");
    }

    const result = await response.json();
    return result.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error.message);
    throw error;
  }
};

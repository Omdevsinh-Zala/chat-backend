import fs from 'fs';
import path from 'path';

export const deleteFile = (name, isProfileImage = false) => {
    try {
        const basePath = isProfileImage
            ? path.join(process.cwd(), 'public/assets/profileImages')
            : path.join(process.cwd(), 'public/assets/uploads');
        const fullPath = path.join(basePath, name);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error(err);
    }
}
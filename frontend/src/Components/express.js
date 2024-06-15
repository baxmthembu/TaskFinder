const express = require('express');
const multer = require('multer');
const app = express();
const port = 3000

const storage = multer.diskstorage({
    destination: (req,res,cb) => {
        cb(null, '../WorkerImages')
    },
    filename: (req,res,cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null,file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
})

const upload = multer({storage: storage})

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        //Path where multer saved the image
        const imagePath = req.file.path;

        const user = new User({profile: imagePath});
        await user.save(); 

        res.json({message: 'Image saved successfully'})
    } catch (error) {
        console.error('Error uploading image:' , error);
        res.status(500).json({error: 'Image upload failed'})
    }
})
import 'multer'
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as fs from 'node:fs';

@Injectable()
export class FileUploadService {
    private readonly logger = new Logger(FileUploadService.name);

    constructor(private readonly prisma : PrismaService){
        cloudinary.config({
            //getting all the configs
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        })
    }


    async uploadFile(file: Express.Multer.File) {
        try{
            const uploadResult = await this.uploadToCloudinary(file.path);

            const newlySavedFile = await this.prisma.file.create({
                data: {
                    filename : file.originalname,
                    publicId : uploadResult.public_id,
                    url : uploadResult.secure_url,
                }
            })

            fs.unlinkSync(file.path);
            return newlySavedFile;

        }catch(error){

            //log the real cause, since the client only gets the generic message

            this.logger.error(
                `File upload failed for ${file.originalname}`,
                error instanceof Error ? error.stack : String(error)
            );
            //removing in case of any error -> this file from local folder
            if(file.path && fs.existsSync(file.path)){
                fs.unlinkSync(file.path)
            }
            throw new InternalServerErrorException('File upload failed! Please try again')
        }
    }
    private uploadToCloudinary(filepath: string) : Promise<UploadApiResponse>{
        return  new Promise((resolve, reject) => {
            void cloudinary.uploader.upload(filepath, (error, result)=>{
                if(error || !result ) return reject(error);
                resolve(result);
            });
        });
    }


    async deleteFile(fileId : string){
        try{

            const file = await this.prisma.file.findUnique({
                    where: {
                    id   : fileId
                }
            })

            if(!file) {
                throw new Error('File not found! Please try with a different file ID')
            }
            //deleting from cloudinary
            await cloudinary.uploader.destroy(file.publicId)
            //deleting from prisma
            await this.prisma.file.delete({
                where: { id: fileId },
            });

            return {
                message: 'File deleted successfully'
            }

        }catch(e){
            throw new InternalServerErrorException(
                'File upload failed! Please try again'
            );
        }
    }
}

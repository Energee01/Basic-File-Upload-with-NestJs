import { Controller, Post, UploadedFile, UseInterceptors, Delete, Param} from '@nestjs/common';
import { FileUploadService } from './file-upload.service'
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'node:path';

@Controller('file-upload')
export class FileUploadController {
    constructor(private readonly fileUploaderService : FileUploadService){}

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination : './uploads',
                filename : (req, file, callback)=> {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()* 1e9);
                    const ext = extname(file.originalname)
                    const filename = `${uniqueSuffix}${ext}`;
                    callback(null, filename)
                }
            })
        })
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File){
        return this.fileUploaderService.uploadFile(file)
    }

    @Delete(':id')
    async deleteFile(@Param('id') id: string){
        return this.fileUploaderService.deleteFile(id)
    }
}
    



import { IsNotEmpty, IsString } from "class-validator";

export class ReportEntryDto {

    @IsNotEmpty()
    @IsString()
    public noteContent: string

    // @IsNotEmpty()
    // @IsString()
    // public channel: string
}
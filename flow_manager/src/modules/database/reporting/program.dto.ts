import { IsNotEmpty, IsString, IsOptional, IsArray } from "class-validator";
import { Domain } from "./domain/domain.model";

export class CreateProgramDto {

    @IsNotEmpty()
    @IsString()
    public name: string

    @IsOptional()
    @IsArray()
    public domains: [Domain]

    @IsOptional()
    @IsArray()
    public ip_ranges: [Object]
}
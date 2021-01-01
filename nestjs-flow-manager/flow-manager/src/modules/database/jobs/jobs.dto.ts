import { IsNotEmpty } from "class-validator";

export class CreateJobDto {
    @IsNotEmpty()
    public task!: string;

    @IsNotEmpty()
    public program!: string;

    @IsNotEmpty()
    public priority!: number;

    @IsNotEmpty()
    public data!: object;
}
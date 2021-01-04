import { IsNotEmpty } from "class-validator";

export class SubmitSubdomainDto {
    @IsNotEmpty()
    subdomains: string[]
}
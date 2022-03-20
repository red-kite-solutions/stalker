import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first, firstValueFrom } from 'rxjs';
import { User } from 'src/app/shared/types/user.interface';
import { fmUrl } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }

  public async getProfile(): Promise<User> {
    let userData: any = await firstValueFrom(this.http.get(`${fmUrl}/users/profile`));
    return {
      firstName: userData.firstName,
      lastName: userData.lastName,
      _id: userData._id,
      email: userData.email,
      role: userData.role, 
      active: userData.active
    };
  }

  public async editProfile(profileEdits: Partial<User>, currentPassword: string): Promise<string> {
    try {
      let data: any = await firstValueFrom(this.http.put(`${fmUrl}/users/profile`, { 
        currentPassword: currentPassword,
        ...profileEdits
      }));
      return data.status;
    } catch (err: any) {
      return "Error";
    }
  }

  public async changePassword(newPassword: string, currentPassword: string): Promise<string> {
    try {
      let data: any = await firstValueFrom(this.http.put(`${fmUrl}/users/profile/password`, { 
        currentPassword: currentPassword,
        newPassword: newPassword,
      }));
      return data.status;
    } catch (err: any) {
      return "Error";
    }
  }

  public async createUser(newUser: Partial<User>, userPassword: string, currentPassword: string): Promise<string> {
    try {
      let data: any = await firstValueFrom(this.http.post(`${fmUrl}/users`, { 
        currentPassword: currentPassword,
        password: userPassword,
        ...newUser
      }));
      return data.status;
    } catch (err: any) {
      return "Error";
    }
  }

  public async getAllUsers(): Promise<User[]> {
    try {
      let data: any = await firstValueFrom(this.http.get(`${fmUrl}/users`));
      return data;
    } catch (err) {
      return [];
    }
  }

  public async getUser(userId: string): Promise<User | null> {
    try {
      let data: any = await firstValueFrom(this.http.get(`${fmUrl}/users/${userId}`));
      return data;
    } catch (err) {
      return null;
    }
  }

  public async deleteUser(userId: string): Promise<string> {
    try {
      let data: any = await firstValueFrom(this.http.delete(`${fmUrl}/users/${userId}`));
      return data.status;
    } catch (err) {
      return "Error";
    }
  }

  public async editUser(userId: string, changes: Partial<User>, currentPassword: string): Promise<string> {
    try {
      let data: any = await firstValueFrom(this.http.put(`${fmUrl}/users/${userId}`, { 
        currentPassword: currentPassword, 
        ...changes 
      }));
      return data.status;
    } catch (err) {
      return "Error";
    }
  }

  public async changeUserPassword(userId: string, newPassword: string, currentPassword: string): Promise<string> {
    try {
      let data: any = await firstValueFrom(this.http.put(`${fmUrl}/users/${userId}/password`, { 
        newPassword: newPassword, 
        currentPassword: currentPassword 
      }));
      return data.status;
    } catch (err) {
      return "Error";
    }
  }
}

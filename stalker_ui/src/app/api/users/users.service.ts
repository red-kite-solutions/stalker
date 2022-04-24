import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { User } from 'src/app/shared/types/user.interface';
import { fmUrl } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient) {}

  public async createUser(newUser: Partial<User>, userPassword: string, currentPassword: string): Promise<User> {
    const userData: any = await firstValueFrom(
      this.http.post(`${fmUrl}/users`, {
        currentPassword: currentPassword,
        password: userPassword,
        ...newUser,
      })
    );
    return {
      firstName: userData.firstName,
      lastName: userData.lastName,
      _id: userData._id,
      email: userData.email,
      role: userData.role,
      active: userData.active,
    };
  }

  public getAllUsers(): Observable<any> {
    return this.http.get(`${fmUrl}/users`);
  }

  public getUser(userId: string) {
    return this.http.get(`${fmUrl}/users/${userId}`);
  }

  public async deleteUser(userId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${fmUrl}/users/${userId}`));
  }

  public async editUser(userId: string, changes: Partial<User>, currentPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${fmUrl}/users/${userId}`, {
        currentPassword: currentPassword,
        ...changes,
      })
    );
  }

  public async changeUserPassword(userId: string, newPassword: string, currentPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${fmUrl}/users/${userId}/password`, {
        newPassword: newPassword,
        currentPassword: currentPassword,
      })
    );
  }
}

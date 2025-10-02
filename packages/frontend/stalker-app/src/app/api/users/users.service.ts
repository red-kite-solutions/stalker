import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { User } from '../../shared/types/user.interface';
import { environment } from '../../../environments/environment';
import { Group } from '../../shared/types/group/group.type';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient) {}

  public async createUser(newUser: Partial<User>, userPassword: string, currentPassword: string): Promise<User> {
    const userData: any = await firstValueFrom(
      this.http.post(`${environment.fmUrl}/users`, {
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
    return this.http.get(`${environment.fmUrl}/users`);
  }

  public getUser(userId: string) {
    return this.http.get<User>(`${environment.fmUrl}/users/${userId}`);
  }

  public async deleteUser(userId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.fmUrl}/users/${userId}`));
  }

  public async editUser(userId: string, changes: Partial<User>, currentPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${environment.fmUrl}/users/${userId}`, {
        currentPassword: currentPassword,
        ...changes,
      })
    );
  }

  public async changeUserPassword(userId: string, newPassword: string, currentPassword?: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${environment.fmUrl}/users/${userId}/password`, {
        newPassword: newPassword,
        currentPassword: currentPassword,
      })
    );
  }

  public async createFirstUser(email: string, password: string, firstName: string, lastName: string) {
    await firstValueFrom(
      this.http.post(`${environment.fmUrl}/firstUser`, {
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      })
    );
  }

  public async requestResetPassword(email: string) {
    await firstValueFrom(this.http.post(`${environment.fmUrl}/users/reset-password-requests`, { email }));
  }

  public getUserGroups(userId: string): Observable<Group[]> {
    return this.http.get<Group[]>(`${environment.fmUrl}/users/${userId}/groups`);
  }
}

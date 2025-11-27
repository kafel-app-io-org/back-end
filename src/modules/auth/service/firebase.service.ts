import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseAdminService {
  constructor(private readonly configService: ConfigService) {
    this.initializeApp();
  }

  async initializeApp() {
    admin.initializeApp({
      credential: admin.credential.cert(
        this.configService.getOrThrow('firebaseConfig') as admin.ServiceAccount,
      ),
    });
  }

  async verifyIdToken(idToken: string) {
    return admin.auth().verifyIdToken(idToken);
  }
}

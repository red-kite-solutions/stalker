using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.IdentityModel.Tokens;

namespace Orchestrator.Utils
{
    public static class CryptoUtils
    {
        private static readonly string PrivateKeyEnvironementVariable = "SECRET_PRIVATE_RSA_KEY";
        private static readonly RSACryptoServiceProvider RSA = InitRsa();
        private static readonly string SecretPrefix = "$$secret$$";
        private static readonly string HmacSecretKeyEnvironmentVariable = "SECRET_HMAC_KEY";
        private static readonly HMACSHA256 Hmac = InitHmac();


        public static byte[] Hmac256ComputeSignature(string payload)
        {
            var payloadBytes = Encoding.UTF8.GetBytes(payload);
            var sigBytes = Hmac.ComputeHash(payloadBytes);
            return sigBytes;
        }

        public static bool Hmac256ValidateSignature(string payload, string signatureBase64)
        {
            try
            {
                byte[] expected;
                expected = Convert.FromBase64String(signatureBase64);
                var actual = Hmac256ComputeSignature(payload);
                if (actual.Length != expected.Length) return false;

                return expected.SequenceEqual(actual);
            }
            catch
            {
                return false;
            }
        }

        private static HMACSHA256 InitHmac()
        {
            var key = Environment.GetEnvironmentVariable(HmacSecretKeyEnvironmentVariable);
            if (key.IsNullOrEmpty()) throw new ArgumentException("Missing environment variable", HmacSecretKeyEnvironmentVariable);
            return new HMACSHA256(Encoding.UTF8.GetBytes(key!));
        }

        private static RSACryptoServiceProvider InitRsa()
        {
            var key = Environment.GetEnvironmentVariable(PrivateKeyEnvironementVariable);
            if (key.IsNullOrEmpty()) throw new ArgumentException("Missing environment variable", PrivateKeyEnvironementVariable);
            var keyBytes = Convert.FromBase64String(key!);

            RSACryptoServiceProvider RSAalg = new();
            RSAalg.ImportFromPem(Encoding.UTF8.GetString(keyBytes));
            return RSAalg;
        }

        /// <summary>
        /// Decrypts the value with the RSA algorithm if the value starts with <see cref="CryptoUtils.SecretPrefix"/>.
        /// Otherwise, it returns the value unchanged.
        /// </summary>
        /// <param name="value">The base64 encoded encrypted value to decrypt</param>
        /// <returns>The decrypted value, or the value unchanged if it did not start with <see cref="CryptoUtils.SecretPrefix"/></returns>
        public static string Decrypt(string value)
        {
            if (!IsSecret(value)) return value;

            var returnValue = value;

            try
            {
                var valueNoPrefix = value.Substring(SecretPrefix.Length);
                var valueBytes = Convert.FromBase64String(valueNoPrefix);
                returnValue = Encoding.UTF8.GetString(RSA.Decrypt(valueBytes, false));
            }
            catch (Exception)
            {
                // If we have an error, we simply return the original value
                // We intentionally soft fail the decryption
            }

            return returnValue;
        }

        public static bool IsSecret(string value)
        {
            return value.StartsWith(SecretPrefix);
        }

    }
}

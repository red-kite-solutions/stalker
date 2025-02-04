using System.Security.Cryptography;
using System.Text;

namespace Orchestrator.Utils
{
    public static class CryptoUtils
    {
        private static readonly string PrivateKeyEnvironementVariable = "SECRET_PRIVATE_RSA_KEY";
        private static readonly RSACryptoServiceProvider RSA = InitRsa();
        private static readonly string SecretPrefix = "$$secret$$";

        private static RSACryptoServiceProvider InitRsa()
        {
            var keyBytes = Convert.FromBase64String(Environment.GetEnvironmentVariable(PrivateKeyEnvironementVariable)!);
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

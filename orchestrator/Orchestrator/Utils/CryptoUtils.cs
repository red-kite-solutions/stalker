using System.Security.Cryptography;
using System.Text;

namespace Orchestrator.Utils
{
    public static class CryptoUtils
    {
        private static string PrivateKeyEnvironementVariable = "SECRET_PRIVATE_RSA_KEY";
        public static string SecretPrefix = "$$secret$$";
        private static string PrivateKey = getPrivateKey();

        private static string getPrivateKey() {
            
            var keyBytes = Convert.FromBase64String(Environment.GetEnvironmentVariable(PrivateKeyEnvironementVariable)!);
            return Encoding.UTF8.GetString(keyBytes);
        }

        /// <summary>
        /// Decrypts the value with the RSA algorithm if the value starts with <see cref="CryptoUtils.SecretPrefix"/>.
        /// Otherwise, it returns the value unchanged.
        /// </summary>
        /// <param name="value">The base64 encoded encrypted value to decrypt</param>
        /// <returns>The decrypted value, or the value unchanged if it did not start with <see cref="CryptoUtils.SecretPrefix"/></returns>
        public static string Decrypt(string value)
        {
            if(!value.StartsWith(SecretPrefix)) return value;

            Console.WriteLine("Starting with prefix " + SecretPrefix);

            var returnValue = value;

            try
            {
                var valueNoPrefix = value.Substring(SecretPrefix.Length);
                var valueBytes = Convert.FromBase64String(valueNoPrefix);

                RSACryptoServiceProvider RSAalg = new RSACryptoServiceProvider();
                RSAalg.ImportFromPem(PrivateKey);
                returnValue = Encoding.UTF8.GetString(RSAalg.Decrypt(valueBytes, false));
                Console.WriteLine("#################\n" + returnValue + "#################\n");
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex);
            }

            return returnValue;
        }

    }
}

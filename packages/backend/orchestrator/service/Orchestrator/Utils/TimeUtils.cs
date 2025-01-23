public static class TimeUtils
{
    public static long CurrentTimeMs()
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.Now.ToUniversalTime());
        return dto.ToUnixTimeMilliseconds();
    }
}
package com.myweb.security.xss;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class XssSanitizerUtil {

    public static String sanitize(String content) {
        if (content == null) {
            return null;
        }
        // Strips all HTML tags and attributes
        return Jsoup.clean(content, Safelist.none());
    }
}

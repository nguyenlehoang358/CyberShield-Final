package com.myweb.controller; // Thay bằng package thực tế của bạn

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontendController {

    // Bắt mọi đường dẫn không bắt đầu bằng /api hoặc các endpoint đặc biệt khác
    @RequestMapping(value = {
            "/",
            "/{x:[\\w\\-]+}",
            "/{x:^(?!api$).*$}/**/{y:[\\w\\-]+}"
    })
    public String forwardToFrontend() {
        // Trả về file index.html của React đang nằm trong resources/static
        return "forward:/index.html"; 
    }
}
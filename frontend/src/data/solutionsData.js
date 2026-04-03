export const SOLUTIONS_DATA = {
    vi: [
        {
            id: 'app-sec',
            title: 'Bảo mật Ứng dụng',
            icon: 'Code',
            description: 'Bảo vệ phần mềm khỏi các lỗ hổng và tấn công mạng.',
            color: 'blue',
            detail: {
                concept: 'Bảo mật ứng dụng là quá trình phát triển, thêm và kiểm tra các tính năng bảo mật trong ứng dụng để ngăn chặn các lỗ hổng bảo mật chống lại các mối đe dọa như truy cập trái phép và sửa đổi.',
                usage: 'Sử dụng các công cụ kiểm tra bảo mật tĩnh (SAST) và động (DAST) để phát hiện lỗ hổng trong quá trình phát triển (SDLC).',
                application: 'Áp dụng cho mọi ứng dụng web, mobile và API. Ngăn chặn các cuộc tấn công phổ biến như SQL Injection, XSS.'
            },
            relatedLabs: [
                { id: 'xss', name: 'XSS Lab', path: '/lab/xss' },
                { id: 'sqli', name: 'SQL Injection Lab', path: '/lab/sqli' }
            ]
        },
        {
            id: 'crypto',
            title: 'Mật mã & Mã hóa',
            icon: 'Lock',
            description: 'Đảm bảo tính bí mật và toàn vẹn của dữ liệu.',
            color: 'purple',
            detail: {
                concept: 'Mật mã học (Cryptography) là khoa học về việc giữ thông tin được an toàn. Nó liên quan đến việc tạo và phân tích các giao thức ngăn chặn các bên thứ ba hoặc công chúng đọc các tin nhắn riêng tư.',
                usage: 'Mã hóa dữ liệu khi lưu trữ (At Rest) và khi truyền tải (In Transit) sử dụng các thuật toán như AES, RSA.',
                application: 'Bảo vệ thông tin đăng nhập, dữ liệu thẻ tín dụng, và giao tiếp riêng tư qua HTTPS.'
            },
            relatedLabs: [
                { id: 'encryption', name: 'Encryption Lab', path: '/lab/encryption' },
                { id: 'hashing', name: 'Hashing Lab', path: '/lab/hashing' }
            ]
        },
        {
            id: 'network',
            title: 'An ninh Mạng',
            icon: 'Shield',
            description: 'Kiểm soát truy cập và giám sát lưu lượng mạng.',
            color: 'green',
            detail: {
                concept: 'An ninh mạng bao gồm các chính sách và thực tiễn được áp dụng để ngăn chặn và giám sát truy cập trái phép, lạm dụng, sửa đổi hoặc từ chối mạng máy tính và các tài nguyên có thể truy cập mạng.',
                usage: 'Triển khai Firewall, VPN, và hệ thống phát hiện xâm nhập (IDS/IPS).',
                application: 'Ngăn chặn tấn công DDoS, lọc gói tin độc hại và đảm bảo an toàn cho hạ tầng mạng doanh nghiệp.'
            },
            relatedLabs: [
                { id: 'firewall', name: 'Firewall Lab', path: '/lab/firewall' },
                { id: 'https', name: 'HTTPS/TLS Lab', path: '/lab/https' }
            ]
        },
        {
            id: 'iam',
            title: 'Quản lý Định danh',
            icon: 'Users',
            description: 'Xác thực và ủy quyền người dùng an toàn.',
            color: 'pink',
            detail: {
                concept: 'IAM (Identity and Access Management) là một khuôn khổ của các quy trình, chính sách và công nghệ tạo điều kiện cho việc quản lý danh tính điện tử.',
                usage: 'Sử dụng Multi-Factor Authentication (MFA), Single Sign-On (SSO) và JSON Web Tokens (JWT).',
                application: 'Đảm bảo đúng người truy cập đúng tài nguyên vào đúng thời điểm.'
            },
            relatedLabs: [
                { id: 'jwt', name: 'JWT Lab', path: '/lab/jwt' },
                { id: 'password', name: 'Password Lab', path: '/lab/password' }
            ]
        },
        {
            id: 'ops',
            title: 'Vận hành An ninh',
            icon: 'Activity',
            description: 'Giám sát, phát hiện và phản ứng sự cố.',
            color: 'coral',
            detail: {
                concept: 'Security Operations (SecOps) là sự cộng tác giữa bảo mật và vận hành CNTT để tích hợp các công cụ, quy trình và công nghệ để giữ an toàn cho doanh nghiệp.',
                usage: 'Sử dụng SIEM, Log Analysis và Vulnerability Scanning.',
                application: 'Phát hiện sớm các dấu hiệu tấn công và phản ứng nhanh chóng để giảm thiểu thiệt hại.'
            },
            relatedLabs: [
                { id: 'scanner', name: 'Security Scanner', path: '/tools/scanner' }
            ]
        },
        {
            id: 'cloud',
            title: 'Bảo mật Đám mây',
            icon: 'Cloud',
            description: 'Bảo vệ dữ liệu và ứng dụng trên nền tảng Cloud.',
            color: 'cyan',
            detail: {
                concept: 'Bảo mật đám mây đề cập đến một tập hợp các chính sách, công nghệ và kiểm soát được triển khai để bảo vệ dữ liệu, ứng dụng và cơ sở hạ tầng của điện toán đám mây.',
                usage: 'Quản lý cấu hình an toàn, mã hóa dữ liệu trên Cloud, và quản lý quyền truy cập (IAM role).',
                application: 'Đảm bảo tuân thủ và an toàn cho các ứng dụng chạy trên AWS, Azure, Google Cloud.'
            },
            relatedLabs: []
        }
    ],
    en: [
        {
            id: 'app-sec',
            title: 'Application Security',
            icon: 'Code',
            description: 'Protect software from vulnerabilities and cyber attacks.',
            color: 'blue',
            detail: {
                concept: 'Application security is the process of developing, adding, and testing security features within applications to prevent security vulnerabilities against threats such as unauthorized access and modification.',
                usage: 'Using Static (SAST) and Dynamic (DAST) application security testing tools to detect vulnerabilities during the SDLC.',
                application: 'Applies to all web, mobile and API apps. Prevents common attacks like SQL Injection, XSS.'
            },
            relatedLabs: [
                { id: 'xss', name: 'XSS Lab', path: '/lab/xss' },
                { id: 'sqli', name: 'SQL Injection Lab', path: '/lab/sqli' }
            ]
        },
        {
            id: 'crypto',
            title: 'Cryptography',
            icon: 'Lock',
            description: 'Ensure data confidentiality and integrity.',
            color: 'purple',
            detail: {
                concept: 'Cryptography is the science of keeping information secure. It involves creating and analyzing protocols that prevent third parties or the public from reading private messages.',
                usage: 'Encrypting data At Rest and In Transit using algorithms like AES, RSA.',
                application: 'Protecting login credentials, credit card data, and private communication via HTTPS.'
            },
            relatedLabs: [
                { id: 'encryption', name: 'Encryption Lab', path: '/lab/encryption' },
                { id: 'hashing', name: 'Hashing Lab', path: '/lab/hashing' }
            ]
        },
        {
            id: 'network',
            title: 'Network Security',
            icon: 'Shield',
            description: 'Access control and network traffic monitoring.',
            color: 'green',
            detail: {
                concept: 'Network security consists of the policies and practices adopted to prevent and monitor unauthorized access, misuse, modification, or denial of a computer network and network-accessible resources.',
                usage: 'Deploying Firewalls, VPNs, and Intrusion Detection Systems (IDS/IPS).',
                application: 'Preventing DDoS attacks, filtering malicious packets and securing enterprise network infrastructure.'
            },
            relatedLabs: [
                { id: 'firewall', name: 'Firewall Lab', path: '/lab/firewall' },
                { id: 'https', name: 'HTTPS/TLS Lab', path: '/lab/https' }
            ]
        },
        {
            id: 'iam',
            title: 'Identity Management',
            icon: 'Users',
            description: 'Secure user authentication and authorization.',
            color: 'pink',
            detail: {
                concept: 'IAM (Identity and Access Management) is a framework of policies and technologies for ensuring that the right users have the appropriate access to technology resources.',
                usage: 'Using Multi-Factor Authentication (MFA), Single Sign-On (SSO) and JSON Web Tokens (JWT).',
                application: 'Ensuring the right people access the right resources at the right time.'
            },
            relatedLabs: [
                { id: 'jwt', name: 'JWT Lab', path: '/lab/jwt' },
                { id: 'password', name: 'Password Lab', path: '/lab/password' }
            ]
        },
        {
            id: 'ops',
            title: 'Security Operations',
            icon: 'Activity',
            description: 'Monitoring, detection and incident response.',
            color: 'coral',
            detail: {
                concept: 'Security Operations (SecOps) is a collaboration between security and IT operations teams to integrate tools, processes, and technology to keep an enterprise secure.',
                usage: 'Using SIEM, Log Analysis and Vulnerability Scanning.',
                application: 'Early detection of attack signs and rapid response to minimize damage.'
            },
            relatedLabs: [
                { id: 'scanner', name: 'Security Scanner', path: '/tools/scanner' }
            ]
        },
        {
            id: 'cloud',
            title: 'Cloud Security',
            icon: 'Cloud',
            description: 'Protect data and applications on Cloud platforms.',
            color: 'cyan',
            detail: {
                concept: 'Cloud security refers to a set of policies, technologies, and controls deployed to protect data, applications, and the associated infrastructure of cloud computing.',
                usage: 'Managing secure configurations, encrypting data on Cloud, and managing access rights (IAM roles).',
                application: 'Ensuring compliance and safety for applications running on AWS, Azure, Google Cloud.'
            },
            relatedLabs: []
        }
    ]
}

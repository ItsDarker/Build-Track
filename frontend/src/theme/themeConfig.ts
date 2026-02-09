import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
    token: {
        fontSize: 14,
        colorPrimary: '#2563EB', // Matches Tailwind blue-600
        borderRadius: 6,
        colorTextHeading: '#1e293b', // slate-800
        colorText: '#334155', // slate-700
    },
    components: {
        Button: {
            controlHeight: 40,
            paddingContentHorizontal: 20,
            fontWeight: 500,
            algorithm: true,
        },
        Input: {
            controlHeight: 40,
        },
        Select: {
            controlHeight: 40,
        },
        Card: {
            borderRadiusLG: 12,
        },
    },
};

export default theme;

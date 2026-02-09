// Fix for antd components not being recognized as valid JSX components in React 19
// This is a known issue: https://github.com/ant-design/ant-design/issues/46053

import * as React from "react";

declare module "antd/es/card" {
  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: React.ReactNode;
    extra?: React.ReactNode;
    bordered?: boolean;
    headStyle?: React.CSSProperties;
    bodyStyle?: React.CSSProperties;
    style?: React.CSSProperties;
    loading?: boolean;
    hoverable?: boolean;
    children?: React.ReactNode;
    id?: string;
    className?: string;
    size?: "default" | "small";
    type?: "inner";
    cover?: React.ReactNode;
    actions?: React.ReactNode[];
    tabList?: Array<{ key: string; tab: React.ReactNode }>;
    activeTabKey?: string;
    defaultActiveTabKey?: string;
    tabBarExtraContent?: React.ReactNode;
    onTabChange?: (key: string) => void;
    tabProps?: any;
    styles?: { header?: React.CSSProperties; body?: React.CSSProperties };
  }

  const Card: React.FC<CardProps> & {
    Grid: React.FC<any>;
    Meta: React.FC<{
      avatar?: React.ReactNode;
      className?: string;
      description?: React.ReactNode;
      style?: React.CSSProperties;
      title?: React.ReactNode;
    }>;
  };

  export { Card, CardProps };
  export default Card;
}

declare module "antd/es/select" {
  interface OptionProps {
    value?: string | number | boolean;
    label?: React.ReactNode;
    disabled?: boolean;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  const Option: React.FC<OptionProps>;
  export { Option };
}

// Re-export for main antd module
declare module "antd" {
  import { Card as CardComponent, CardProps } from "antd/es/card";
  import { Option as OptionComponent } from "antd/es/select";

  export const Card: typeof CardComponent;
  export type { CardProps };
  export const Option: typeof OptionComponent;
}

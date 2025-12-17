export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'html' | 'social' | 'video';
export type ContainerType = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4' | 'layout-70-30' | 'layout-30-70' | 'layout-60-40' | 'layout-40-60';
export type ElementType = BlockType | ContainerType | 'column';

export interface ElementStyle {
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    width?: string;
    height?: string;
    borderRadius?: string;
    border?: string;
    [key: string]: any;
}

export interface EmailElement {
    id: string;
    type: ElementType;
    props: {
        content?: string;
        src?: string;
        alt?: string;
        url?: string;
        text?: string;
        style?: ElementStyle;
        [key: string]: any;
    };
    children?: EmailElement[]; // For layouts
}

export interface GlobalStyle {
    backgroundColor?: string;
    backgroundImage?: string;
    contentBackgroundColor?: string; // Background color of the email content area
    contentWidth?: string;
    fontFamily?: string;
    fontSize?: string;
    textColor?: string;
    lineHeight?: string;
    paddingTop?: string;
    paddingBottom?: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    elements: EmailElement[];
    version: string;
    globalStyles?: GlobalStyle;
}

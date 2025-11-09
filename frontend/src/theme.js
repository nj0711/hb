import { extendTheme } from '@chakra-ui/react';

// Configuration for Dark Mode
const config = {
  // 1. Use the system setting as the initial color mode
  initialColorMode: 'system', 
  // 2. Allow the user to toggle the color mode
  useSystemColorMode: true, 
};

// You can customize colors here to set your brand's dark/light palette
const colors = {
  brand: {
    500: '#3182CE', // Your primary brand color
  },
};

// Extend the base theme with your custom settings
const theme = extendTheme({ 
    config, 
    colors,
    styles: {
        global: (props) => ({
            // This sets the default background and text color for the entire body/page
            body: {
                bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
                color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
            },
        }),
    },
});

export default theme;
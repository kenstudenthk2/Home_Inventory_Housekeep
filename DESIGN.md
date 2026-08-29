---
name: "Jamm"
description: "Design tokens extracted from https://www.jamm.co/"
colors:
  primary: "#353148"
  secondary: "#B8B5C6"
  tertiary: "#EE4D87"
  surface: "#928E94"
  on-surface: "#000000"
typography:
  text-1:
    fontFamily: "Ginkatrial"
    fontSize: "120px"
    fontWeight: 600
    lineHeight: 1
  text-2:
    fontFamily: "Ginkatrial"
    fontSize: "98px"
    fontWeight: 700
    lineHeight: 1
  text-3:
    fontFamily: "Ginkatrial"
    fontSize: "98px"
    fontWeight: 700
    lineHeight: 1
  text-4:
    fontFamily: "Ginkatrial"
    fontSize: "98px"
    fontWeight: 700
    lineHeight: 1
  text-5:
    fontFamily: "Ginkatrial"
    fontSize: "98px"
    fontWeight: 700
    lineHeight: 1
  text-6:
    fontFamily: "Ginkatrial"
    fontSize: "98px"
    fontWeight: 700
    lineHeight: 1
  text-7:
    fontFamily: "Ginkatrial"
    fontSize: "67px"
    fontWeight: 700
    lineHeight: 0.8
  text-8:
    fontFamily: "Ginkatrial"
    fontSize: "64px"
    fontWeight: 300
    lineHeight: 1
  text-9:
    fontFamily: "Ginkatrial"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
  text-10:
    fontFamily: "Ginkatrial"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 0.84
  text-11:
    fontFamily: "Instrument Sans"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.4
  text-12:
    fontFamily: "Ginkatrial"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 0.95
  text-13:
    fontFamily: "Instrument Sans"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.1
  text-14:
    fontFamily: "Instrument Sans"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
  text-15:
    fontFamily: "Ginkatrial"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.4
  text-16:
    fontFamily: "Instrument Sans"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
  text-17:
    fontFamily: "Ginkatrial"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.33
  text-18:
    fontFamily: "Instrument Sans"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1
  text-19:
    fontFamily: "Instrument Sans"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1
  text-20:
    fontFamily: "Instrument Sans"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
  text-21:
    fontFamily: "Ginkatrial"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.57
  text-22:
    fontFamily: "Ginkatrial Book"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
  text-23:
    fontFamily: "Ginkatrial Book"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
  text-24:
    fontFamily: "Instrument Sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
  text-25:
    fontFamily: "Instrument Sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
spacing:
  base: "8px"
  xs: "4px"
  sm: "5px"
  md: "8px"
  lg: "10px"
  xl: "15px"
  xxl: "16px"
  xxxl: "18px"
  xxxxl: "20px"
rounded:
  sm: "10px"
  md: "20px"
  lg: "25px"
  xl: "30px"
  full: "9999px"
components:
  button-observed:
    backgroundColor: "{colors.tertiary}"
    textColor: "#F0ECE0"
    rounded: "100px"
    padding: "0px"
---

# Design System

## Overview
Design tokens extracted from jamm.co. The YAML front matter contains machine-readable values observed by Dembrandt when available; the sections below summarize the extracted evidence without redesigning or correcting the source site.

## Colors
- **Primary** (#353148): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **Secondary** (#B8B5C6): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **Tertiary** (#EE4D87): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **Surface** (#928E94): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **On Surface** (#000000): Observed color token extracted from the site's palette, semantic CSS, or component styles.

## Typography
- **Text 1**: Ginkatrial, 120px, semi-bold
- **Text 2**: Ginkatrial, 98px, bold
- **Text 3**: Ginkatrial, 98px, bold
- **Text 4**: Ginkatrial, 98px, bold
- **Text 5**: Ginkatrial, 98px, bold
- **Text 6**: Ginkatrial, 98px, bold
- **Font source**: Google Fonts (Open Sans)
- **Font URLs**: https://cdn.prod.website-files.com/646d198164f9c7efcdcdbd29/64c282bf37abe3c6488879eb_GinkaTRIAL-Medium.otf, https://cdn.prod.website-files.com/646d198164f9c7efcdcdbd29/64c282bf3f0e2c7f2105a55f_GinkaTRIAL-Bold.otf, https://cdn.prod.website-files.com/646d198164f9c7efcdcdbd29/64c282bfb65cd323e92ba0a4_GinkaTRIAL-Book.otf, https://cdn.prod.website-files.com/646d198164f9c7efcdcdbd29/64c287c8d047fa442a876962_GinkaTRIAL-Light.otf, https://fonts.googleapis.com/css?family=Open+Sans:300,300italic,400,400italic,600,600italic,700,700italic,800,800italic%7CDroid+Sans:400,700%7CInstrument+Sans:300,400,500,600,700%7CInstrument+Serif:300,400,500,600,700

## Layout
Observed spacing scale: 8px spacing scale.
- **Spacing tokens**: base 8px, xs 4px, sm 5px, md 8px, lg 10px, xl 15px, xxl 16px, xxxl 18px, xxxxl 20px
- **Responsive breakpoints**: 479px, 767px, 768px, 991px, 992px

## Shapes
Observed rounded-corner tokens: sm 10px, md 20px, lg 25px, xl 30px, full 9999px.

## Components
- **Buttons**: Observed sample with radius 100px, background #EE4D87, text #F0ECE0, padding 0px

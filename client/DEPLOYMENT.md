# TaskFlow Frontend Deployment Guide

This guide provides step-by-step instructions for deploying the TaskFlow frontend to various hosting providers.

## Prerequisites

- Node.js v14+ and npm installed
- TaskFlow backend already deployed and available
- Git repository access
- Account on the selected hosting platform (Vercel, Netlify, or GitHub Pages)

## General Preparation

1. Update production environment variables:
   ```bash
   cp production.env.example production.env
   # Edit production.env with your backend URL and other settings
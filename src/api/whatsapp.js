/* eslint-disable */
import express from 'express';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { handleMessage } from '../handlers/messageHandler';

// Move Express server code here 
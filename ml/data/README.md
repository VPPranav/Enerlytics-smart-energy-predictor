# Real Dataset Documentation: Appliances Energy Prediction

## 1. Dataset Overview
- **Dataset Name**: Appliances Energy Prediction Dataset
- **Authors**: Luis M. Candanedo, Veronique Feldheim, Dominique Deramaix (Faculty of Engineering, University of Mons, Belgium)
- **Source**: UCI Machine Learning Repository
- **Dataset URL**: https://archive.ics.uci.edu/dataset/374/appliances+energy+prediction
- **Raw Data Mirror**: https://raw.githubusercontent.com/LuisM78/Appliances-energy-prediction-data/master/energydata_complete.csv
- **Citation**: Candanedo, L. M., Feldheim, V., & Deramaix, D. (2017). *Data driven prediction models of energy use of appliances in a low-energy house.* Energy and Buildings, 140, 81-97.

## 2. Dataset Specifications
- **Total Records**: 19,735 instances (logged every 10 minutes)
- **Time Period**: January 11, 2016 at 17:00 to May 27, 2016 at 18:00 (approx. 4.5 months)
- **Target Variable**: `Appliances` (Energy use in Wh, converted to kWh for real-time predictions)
- **Sub-metered Lighting**: `lights` (Energy consumption of light fixtures in Wh)

## 3. Physical Measured Features
- **Temporal**: Date and timestamp logged at 10-minute intervals (`date`)
- **Indoor Environment Sensors**:
  - `T1` - Kitchen temperature in °C
  - `RH_1` - Kitchen humidity in %
  - `T2` - Living room temperature in °C
  - `RH_2` - Living room humidity in %
  - `T3` - Laundry room temperature in °C
  - `RH_3` - Laundry room humidity in %
  - `T4` - Office room temperature in °C
  - `RH_4` - Office room humidity in %
  - `T5` - Bathroom temperature in °C
  - `RH_5` - Bathroom humidity in %
  - `T6` - Outside building north side temperature in °C
  - `RH_6` - Outside building north side humidity in %
  - `T7` - Ironing room temperature in °C
  - `RH_7` - Ironing room humidity in %
  - `T8` - Teenager room 2 temperature in °C
  - `RH_8` - Teenager room 2 humidity in %
  - `T9` - Parents room temperature in °C
  - `RH_9` - Parents room humidity in %
- **External Weather Station Measurements (Chièvres Airport Weather Station)**:
  - `T_out` - Outdoor ambient temperature in °C
  - `Press_mm_hg` - Atmospheric pressure in mm Hg
  - `RH_out` - Outdoor humidity in %
  - `Windspeed` - Wind speed in m/s
  - `Visibility` - Visibility in km
  - `Tdewpoint` - Dew point temperature in °C
- **Random Variables**: `rv1`, `rv2` (introduced in original paper as non-predictive baseline checks)

## 4. Preprocessing & Feature Engineering
To make this real historical energy dataset suitable for both residential & commercial smart forecasting with Open-Meteo weather inputs:
1. **Timestamp Decomposition**:
   - `hour` (0 to 23)
   - `day_of_week` (0=Monday to 6=Sunday)
   - `month` (1 to 12)
   - `is_weekend` (binary flag for Saturday & Sunday)
   - `is_peak_hour` (binary flag for evening 17:00-22:00 & morning 07:00-09:00 peaks)
2. **Lagged Autoregressive Features**:
   - `previous_consumption`: Lagged energy consumption (previous 1-hour average in kWh) to capture autoregressive inertia without future lookahead or data leakage.
3. **Environmental Signals**:
   - Outdoor temperature (`temperature`)
   - Outdoor relative humidity (`humidity`)
4. **Building Context**:
   - `building_type` (Residential, Commercial, Other)
   - `floor_area` (m²)
   - `occupants` (count)
   - `appliance_usage_level` (categorical: Low, Medium, High, Very High)

## 5. Time-Series Aware Validation
- **No Random Shuffling**: In accordance with temporal forecasting principles, the dataset is split chronologically:
  - **Train Period** (First 70%): Jan 11, 2016 – Apr 15, 2016 (13,814 records)
  - **Validation Period** (Next 15%): Apr 15, 2016 – May 06, 2016 (2,960 records)
  - **Unseen Final Test Period** (Final 15%): May 06, 2016 – May 27, 2016 (2,961 records)
- Used for evaluating **Linear Regression**, **Random Forest**, and **XGBoost Regressor** on unseen future data.

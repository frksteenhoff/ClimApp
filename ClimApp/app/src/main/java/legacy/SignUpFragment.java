package legacy;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.android.climapp.R;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Fragment with signup information when the user
 * decides to create a ClimApp account
 */

public class SignUpFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_signup, container, false);
    }
}
